interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "로딩 중..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-12 h-12 border border-blue-300 rounded-full animate-pulse"></div>
        </div>
        <p className="text-gray-600 mt-4 font-medium">{message}</p>
      </div>
    </div>
  );
}
