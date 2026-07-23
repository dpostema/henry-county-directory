export default function Loading() {
  return (
    <div className="min-h-screen bg-brandBg-app flex flex-col items-center justify-center font-body">
      <div className="flex flex-col items-center space-y-4">
        {/* Animated spinner */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-brandBorder-light"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin"></div>
        </div>
        <p className="text-sm text-brandText-light font-light">Loading...</p>
      </div>
    </div>
  );
}
