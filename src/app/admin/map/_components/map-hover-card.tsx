import type { MapSchool } from "../types";

export function MapHoverCard({ school }: { school: MapSchool }) {
  return (
    <div className="min-w-64 max-w-80 space-y-3 p-1">
      <div>
        <div className="font-semibold leading-tight">
          {school.name || "Schule ohne Namen"}
        </div>
        {school.address ? (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {school.address}
          </div>
        ) : null}
      </div>
      {school.children.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          Keine Kinder an diesem Tag aktiv.
        </div>
      ) : (
        <ul className="space-y-2">
          {school.children.map((child) => (
            <li
              key={child.id}
              className="border-t border-border pt-2 first:border-t-0 first:pt-0"
            >
              <div className="text-sm font-medium">
                {child.firstName} {child.lastName}
              </div>
              {child.assistants.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Kein Schulbegleiter zugeordnet
                </div>
              ) : (
                <ul className="mt-0.5 space-y-0.5">
                  {child.assistants.map((a) => (
                    <li
                      key={`${child.id}-${a.userId}`}
                      className="text-xs text-foreground"
                    >
                      {a.name}
                      {a.tandem ? (
                        <span className="ml-1 text-muted-foreground">
                          (Tandem)
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
