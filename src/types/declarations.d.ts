/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
declare module "lucide-react" {
  export type IconProps = import("react").SVGProps<SVGSVGElement> & {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
    [key: string]: any;
  };
  export type Icon = import("react").FC<IconProps>;
  export type LucideIcon = Icon;

  export const Activity: Icon;
  export const AlertCircle: Icon;
  export const AlertTriangle: Icon;
  export const AlignLeft: Icon;
  export const ArrowRight: Icon;
  export const ArrowUpRight: Icon;
  export const BarChart3: Icon;
  export const Bell: Icon;
  export const BellDot: Icon;
  export const BookOpen: Icon;
  export const BrainCircuit: Icon;
  export const Building2: Icon;
  export const Calendar: Icon;
  export const CalendarClock: Icon;
  export const Check: Icon;
  export const CheckCircle2: Icon;
  export const ChevronDown: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const ChevronUp: Icon;
  export const CircleDot: Icon;
  export const Clock: Icon;
  export const Command: Icon;
  export const Copy: Icon;
  export const CreditCard: Icon;
  export const Download: Icon;
  export const Edit: Icon;
  export const Expand: Icon;
  export const ExternalLink: Icon;
  export const File: Icon;
  export const FileCheck: Icon;
  export const FileCode2: Icon;
  export const FileDiff: Icon;
  export const FileEdit: Icon;
  export const FileSearch: Icon;
  export const FileSymlink: Icon;
  export const FileText: Icon;
  export const FileWarning: Icon;
  export const Filter: Icon;
  export const Folder: Icon;
  export const FolderGit2: Icon;
  export const HelpCircle: Icon;
  export const History: Icon;
  export const Inbox: Icon;
  export const Info: Icon;
  export const Key: Icon;
  export const LayoutDashboard: Icon;
  export const Link: Icon;
  export const Loader2: Icon;
  export const LogOut: Icon;
  export const Mail: Icon;
  export const MapPin: Icon;
  export const Maximize: Icon;
  export const Menu: Icon;
  export const MessageSquare: Icon;
  export const Mic: Icon;
  export const Minimize: Icon;
  export const Minus: Icon;
  export const MoreHorizontal: Icon;
  export const MoreVertical: Icon;
  export const PenTool: Icon;
  export const Phone: Icon;
  export const Plus: Icon;
  export const RefreshCw: Icon;
  export const Scale: Icon;
  export const Search: Icon;
  export const Send: Icon;
  export const Settings: Icon;
  export const Share2: Icon;
  export const Shield: Icon;
  export const ShieldAlert: Icon;
  export const ShieldCheck: Icon;
  export const Smartphone: Icon;
  export const Sparkles: Icon;
  export const Star: Icon;
  export const Tag: Icon;
  export const Target: Icon;
  export const Terminal: Icon;
  export const ThumbsUp: Icon;
  export const Trash: Icon;
  export const Trash2: Icon;
  export const TrendingUp: Icon;
  export const Upload: Icon;
  export const UploadCloud: Icon;
  export const User: Icon;
  export const Users: Icon;
  export const X: Icon;
  export const XCircle: Icon;
  export const XIcon: Icon;
  export const Zap: Icon;
  export const ChevronDownIcon: Icon;
  export const CheckIcon: Icon;
  export const ChevronUpIcon: Icon;
  export const CircleCheckIcon: Icon;
  export const InfoIcon: Icon;
  export const TriangleAlertIcon: Icon;
  export const OctagonXIcon: Icon;
  export const Loader2Icon: Icon;
  export const SearchIcon: Icon;
  export const CircleFadingPlusIcon: Icon;
  export const Moon: Icon;
  export const Sun: Icon;
  export const SplitSquareHorizontal: Icon;
  export const List: Icon;
  export const FileCheck2: Icon;
  export const Monitor: Icon;
  export const HardDrive: Icon;
  export const ArrowUp: Icon;
  export const ArrowDown: Icon;
  export const ArrowUpDown: Icon;
  export const FolderOpen: Icon;
  export const CalendarIcon: Icon;
  export const CalendarCheck: Icon;
}

declare module "@vitejs/plugin-react" {
  const plugin: any;
  export default plugin;
}

declare module "framer-motion" {
  export interface AnimationProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    style?: any;
    className?: string;
    [key: string]: any;
  }

  export type HTMLMotionProps<T = any> = any;

  export const motion: {
    [
      K in keyof import("react").ReactHTML
    ]: import("react").ForwardRefExoticComponent<
      import("react").PropsWithoutRef<any> & import("react").RefAttributes<any>
    >;
  } & {
    (
      Component: import("react").ComponentType<any> | string,
    ): import("react").ForwardRefExoticComponent<
      import("react").PropsWithoutRef<any> & import("react").RefAttributes<any>
    >;
  };

  export const AnimatePresence: import("react").ComponentType<any>;
  export const LayoutGroup: import("react").ComponentType<any>;
  export const useAnimation: () => any;
  export const useScroll: (options?: any) => any;
  export const useTransform: (
    value: any,
    inputRange: any,
    outputRange: any,
  ) => any;
  export const useSpring: (source: any, config?: any) => any;
  export const useReducedMotion: () => boolean | null;
}

declare module "bullmq" {
  export class Queue {
    constructor(name: string, opts?: any);
    add(name: string, data: any, opts?: any): Promise<any>;
  }

  export class Worker {
    constructor(
      name: string,
      processor: (job: Job) => Promise<any>,
      opts?: any,
    );
    on(event: string, callback: (...args: any[]) => void): this;
  }

  export interface Job<T = any> {
    id: string;
    name: string;
    data: T;
    returnvalue: any;
    progress: number;
    delay: number;
    timestamp: number;
    attemptsMade: number;
    opts: any;
    remove(): Promise<void>;
  }
}
