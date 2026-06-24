export interface RfidCameraState {
  pos: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  fogDensity: number;
}

export interface RfidSceneApi {
  transitionTo: (cameraState: RfidCameraState) => void;
  getCurrentState: () => string;
}

declare global {
  interface Window {
    rfidScene?: RfidSceneApi;
  }
}
