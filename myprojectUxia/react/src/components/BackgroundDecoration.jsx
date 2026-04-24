import React from "react";

const BackgroundDecoration = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
    <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-accent/10 blur-[120px] rounded-full transform -rotate-12"></div>
    <div className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-accent/10 blur-[120px] rounded-full transform rotate-12"></div>
  </div>
);

export default BackgroundDecoration;
