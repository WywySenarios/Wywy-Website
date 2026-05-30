import Capacitor

@objc class WywyBridgeViewController: CAPBridgeViewController {
    override func router() -> Router {
        return WywyRouter()
    }
}
