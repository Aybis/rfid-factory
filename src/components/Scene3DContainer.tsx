export default function Scene3DContainer() {
  return (
    <div
      id="scene-3d-global"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
      }}
    />
  );
}
