export const LoadingScreen = () => {
  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col gap-2 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
      LOADING...
    </div>
  );
};
