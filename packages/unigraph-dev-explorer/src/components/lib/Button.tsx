import classNames from "classnames";
import { ReactNode } from "react";

export function Button({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }): JSX.Element {

  return (
    <button
      type="button"
      {...props}
      className={classNames(
        `inline-flex items-center gap-1 rounded border ${
          props?.className?.includes("bg-") ? "" : "bg-white"
        } border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`,
        props?.className
      )}
    >
      {children}
    </button>
  );
}
