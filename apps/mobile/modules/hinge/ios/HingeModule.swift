import ExpoModulesCore
import UIKit

/// Reports the hinge of a foldable iPhone (iPhone Duo) to JavaScript: status and angle in degrees.
/// Uses UIHingeInteraction (iOS 27.1+) on the key window; on other devices the status stays "unknown".
public class HingeModule: Module {
  private var interaction: AnyObject?
  private weak var window: UIWindow?
  private let lock = NSLock()
  private var state: [String: Any] = ["status": "unknown", "angle": NSNull()]
  private var keyObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("MGLHinge")
    Events("onChange")

    Function("current") { () -> [String: Any] in
      self.lock.lock()
      defer { self.lock.unlock() }
      return self.state
    }

    OnStartObserving {
      DispatchQueue.main.async {
        self.attach(retries: 10)
        // Folding/unfolding can move the app to another window: follow the key window.
        self.keyObserver = NotificationCenter.default.addObserver(forName: UIWindow.didBecomeKeyNotification, object: nil, queue: .main) { [weak self] note in
          guard let self, let win = note.object as? UIWindow, win !== self.window else { return }
          self.detach(keepObserver: true)
          self.attach(retries: 0)
        }
      }
    }

    OnStopObserving {
      DispatchQueue.main.async { self.detach(keepObserver: false) }
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
      // nil: this window no longer gets hinge updates; keep the last state until another one does.
      guard let hinge = update.hinge else { return }
      self?.publish(hinge)
    }
    win.addInteraction(i)
    interaction = i
    window = win
  }

  private func detach(keepObserver: Bool) {
    if !keepObserver, let o = keyObserver {
      NotificationCenter.default.removeObserver(o)
      keyObserver = nil
    }
    guard #available(iOS 27.1, *) else { return }
    if let i = interaction as? UIHingeInteraction { window?.removeInteraction(i) }
    interaction = nil
    window = nil
  }

  @available(iOS 27.1, *)
  private func publish(_ hinge: UIHinge) {
    var next: [String: Any] = ["status": "unknown", "angle": Double(hinge.angle) * 180 / Double.pi]
    switch hinge.status {
    case .closed: next["status"] = "closed"
    case .partiallyOpen: next["status"] = "partial"
    case .fullyOpen: next["status"] = "open"
    default: next["status"] = "unknown"
    }
    lock.lock()
    state = next
    lock.unlock()
    sendEvent("onChange", next)
  }
}
