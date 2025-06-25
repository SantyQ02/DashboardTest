import { cn } from "@/lib/utils";

export interface Weekdays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export type WeekdaysDisplayProps = {
  weekdays: Weekdays;
  className?: string;
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-4 w-4 text-[10px]",
  md: "h-6 w-6 text-[13px]",
  lg: "h-8 w-8 text-base",
};

const radiusMap = {
  sm: "rounded-[2px]",
  md: "rounded-[4px]",
  lg: "rounded-md",
};

export function WeekdaysDisplay({
  weekdays,
  className,
  size = "md",
}: WeekdaysDisplayProps) {
  const dayMap = [
    ["S", "sunday"],
    ["M", "monday"],
    ["T", "tuesday"],
    ["W", "wednesday"],
    ["T", "thursday"],
    ["F", "friday"],
    ["S", "saturday"],
  ];

  return (
    <div className={cn("flex items-center gap-1 justify-center w-full", className)}>
      {dayMap.map(([label, key]) => (
        <span
          key={key}
          className={cn(
            "inline-flex items-center justify-center font-semibold select-none transition-colors",
            sizeMap[size],
            radiusMap[size],
            weekdays[key as keyof Weekdays]
              ? "bg-primary text-primary-foreground dark:text-black"
              : "bg-muted text-muted-foreground/60 border border-muted-foreground/10",
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
