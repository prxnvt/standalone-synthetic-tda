import { useState, createContext, useContext, ReactNode } from "react";

/** True when children are rendered inside the expanded modal */
export const ExpandedContext = createContext(false);
export function useIsExpanded() {
  return useContext(ExpandedContext);
}

interface ExpandablePanelProps {
  children: ReactNode;
}

export default function ExpandablePanel({ children }: ExpandablePanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="expandable-panel">
        {!expanded ? (
          <>
            {children}
            <button
              className="expand-toggle"
              onClick={() => setExpanded(true)}
              title="Expand"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              color: "var(--muted)",
              fontSize: 11,
              fontFamily: "var(--mono)",
              minHeight: 260,
            }}
          >
            expanded view open
          </div>
        )}
      </div>

      {expanded && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0, 0, 0, 0.2)" }}
            onClick={() => setExpanded(false)}
          />
          <div className="expand-modal">
            <button
              className="expand-close"
              onClick={() => setExpanded(false)}
              title="Close"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <ExpandedContext.Provider value={true}>
              {children}
            </ExpandedContext.Provider>
          </div>
        </>
      )}
    </>
  );
}
