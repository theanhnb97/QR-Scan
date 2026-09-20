import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Contacts
import ContactsUI
import EventKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  private var privacyOverlay: UIView?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "QRScanApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  func applicationWillResignActive(_ application: UIApplication) {
    guard let window else { return }
    let overlay = UIVisualEffectView(effect: UIBlurEffect(style: .systemChromeMaterialDark))
    overlay.frame = window.bounds
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    window.addSubview(overlay)
    privacyOverlay = overlay
  }

  func applicationDidBecomeActive(_ application: UIApplication) {
    privacyOverlay?.removeFromSuperview()
    privacyOverlay = nil
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

@objc(NativeSmartActions)
final class NativeSmartActions: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "NativeSmartActions" }
  static func requiresMainQueueSetup() -> Bool { true }

  @objc func openWifiSettings(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let url = URL(string: UIApplication.openSettingsURLString) else {
      reject("WIFI_SETTINGS_FAILED", "Settings URL is unavailable", nil)
      return
    }
    DispatchQueue.main.async {
      UIApplication.shared.open(url) { opened in
        opened ? resolve(true) : reject("WIFI_SETTINGS_FAILED", "Settings could not be opened", nil)
      }
    }
  }

  @objc func addContact(
    _ name: String,
    phone: String?,
    email: String?,
    organization: String?,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let store = CNContactStore()
    store.requestAccess(for: .contacts) { granted, error in
      guard granted else {
        reject("CONTACT_PERMISSION_DENIED", error?.localizedDescription ?? "Contacts permission was denied", error)
        return
      }
      let contact = CNMutableContact()
      contact.givenName = name
      if let organization, !organization.isEmpty { contact.organizationName = organization }
      if let phone, !phone.isEmpty { contact.phoneNumbers = [CNLabeledValue(label: CNLabelPhoneNumberMobile, value: CNPhoneNumber(stringValue: phone))] }
      if let email, !email.isEmpty { contact.emailAddresses = [CNLabeledValue(label: CNLabelHome, value: email as NSString)] }
      DispatchQueue.main.async {
        guard let presenter = Self.topViewController() else {
          reject("CONTACT_HANDOFF_FAILED", "No active view controller", nil)
          return
        }
        let controller = CNContactViewController(forNewContact: contact)
        presenter.present(controller, animated: true) { resolve(true) }
      }
    }
  }

  @objc func addCalendarEvent(
    _ title: String,
    startDate: String?,
    endDate: String?,
    location: String?,
    description: String?,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let store = EKEventStore()
    let requestAccess: (@escaping (Bool, Error?) -> Void) -> Void = { completion in
      if #available(iOS 17.0, *) {
        store.requestFullAccessToEvents(completion: completion)
      } else {
        store.requestAccess(to: .event, completion: completion)
      }
    }
    requestAccess { granted, error in
      guard granted else {
        reject("CALENDAR_PERMISSION_DENIED", error?.localizedDescription ?? "Calendar permission was denied", error)
        return
      }
      let event = EKEvent(eventStore: store)
      event.title = title
      event.location = location
      event.notes = description
      event.startDate = Self.parseCalendarDate(startDate) ?? Date()
      event.endDate = Self.parseCalendarDate(endDate) ?? event.startDate.addingTimeInterval(3600)
      event.calendar = store.defaultCalendarForNewEvents
      do {
        try store.save(event, span: .thisEvent)
        resolve(true)
      } catch {
        reject("CALENDAR_SAVE_FAILED", error.localizedDescription, error)
      }
    }
  }

  private static func parseCalendarDate(_ value: String?) -> Date? {
    guard let value, !value.isEmpty else { return nil }
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    formatter.dateFormat = "yyyyMMdd'T'HHmmss'Z'"
    if let date = formatter.date(from: value.hasSuffix("Z") ? value : "\(value)Z") { return date }
    formatter.dateFormat = "yyyyMMdd"
    return formatter.date(from: value)
  }

  private static func topViewController(_ controller: UIViewController? = nil) -> UIViewController? {
    let base = controller ?? UIApplication.shared.connectedScenes
      .compactMap { ($0 as? UIWindowScene)?.windows.first(where: { $0.isKeyWindow })?.rootViewController }
      .first
    if let presented = base?.presentedViewController { return topViewController(presented) }
    if let navigation = base as? UINavigationController { return topViewController(navigation.visibleViewController) }
    if let tab = base as? UITabBarController { return topViewController(tab.selectedViewController) }
    return base
  }
}

@objc(NativeImageClipboard)
final class NativeImageClipboard: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "NativeImageClipboard" }
  static func requiresMainQueueSetup() -> Bool { true }

  @objc func copyImage(
    _ path: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let normalizedPath = path.hasPrefix("file://") ? String(path.dropFirst("file://".count)) : path
    guard let image = UIImage(contentsOfFile: normalizedPath) else {
      reject("IMAGE_CLIPBOARD_FAILED", "The image could not be loaded", nil)
      return
    }
    DispatchQueue.main.async {
      UIPasteboard.general.image = image
      resolve(true)
    }
  }
}
