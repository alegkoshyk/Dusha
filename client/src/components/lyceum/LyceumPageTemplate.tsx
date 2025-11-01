import { ReactNode } from "react";
import { LyceumNavigation } from "./LyceumNavigation";
import { LyceumFooter } from "./LyceumFooter";

interface LyceumPageTemplateProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function LyceumPageTemplate({ children, title, description }: LyceumPageTemplateProps) {
  return (
    <div className="min-h-screen bg-white">
      <LyceumNavigation />

      {/* Page Header */}
      {(title || description) && (
        <div className="pt-24 pb-12 bg-gradient-to-br from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {title && (
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className={title || description ? "py-12" : "pt-24 pb-12"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>

      <LyceumFooter />
    </div>
  );
}
