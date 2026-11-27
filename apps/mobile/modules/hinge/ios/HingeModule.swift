import ExpoModulesCore
import UIKit

/// Reports the hinge of a foldable iPhone (iPhone Duo) to JavaScript: status and angle in degrees.
/// Uses UIHingeInteraction (iOS 27.1+) on the key window; on other devices the status stays "unknown".
public class HingeModule: Module {
  private var interaction: AnyObject?
  private weak var window: UIWindow?
  private let lock = NSLock()
  private var state: [String: Any] = ["status": "unknown", "angle": NSNull()]

  public func definition() -> ModuleDefinition {
    Name("MGLHinge")
    Events("onChange")

    Function("current") { () -> [String: Any] in
      self.lock.lock()
      defer { self.lock.unlock() }
      return self.state
    }

    OnStartObserving {
      DispatchQueue.main.async { self.attach(retries: 10) }
    }

    OnStopObserving {
      DispatchQueue.main.async { self.detach() }
    }
  }

  private func keyWindow() -> UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
  }

  private func attach(retries: Int) {
    guard #available(iOS 27.1, *) else { return }
    guard interaction == nil else { return }
    guard let win = keyWindow() else {
      // The window may not exist yet at launch.
      if retries > 0 {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { self.attach(retries: retries - 1) }
      }
      return
    }
    let i = UIHingeInteraction { [weak self] _, update in
      self?.publish(update.hinge)
    }
    win.addInteraction(i)
    interaction = i
    window = win
  }

  private func detach() {
    guard #available(iOS 27.1, *) else { return }
    if let i = interaction as? UIHingeInteraction { window?.removeInteraction(i) }
    interaction = nil
    window = nil
  }

  @available(iOS 27.1, *)
  private func publish(_ hinge: UIHinge?) {
    var next: [String: Any] = ["status": "unknown", "angle": NSNull()]
    if let hinge {
      switch hinge.status {
      case .closed: next["status"] = "closed"
      case .partiallyOpen: next["status"] = "partial"
      case .fullyOpen: next["status"] = "open"
      default: next["status"] = "unknown"
      }
      next["angle"] = Double(hinge.angle) * 180 / Double.pi
    }
    lock.lock()
    state = next
    lock.unlock()
    sendEvent("onChange", next)
  }
}
