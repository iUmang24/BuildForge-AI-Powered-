export default function MaintenancePage() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background text-center px-6">
      <h1 className="text-3xl font-bold mb-4">🚧 Under Maintenance</h1>
      <p className="text-muted-foreground max-w-md">
        We are currently upgrading the platform.
        Please check back in a little while.
      </p>
    </div>
  );
}