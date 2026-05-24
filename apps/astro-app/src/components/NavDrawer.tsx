import { Menu, House, BookOpen } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";

export default function NavDrawer() {
  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <button className="hamburger-trigger">
          <Menu />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="flex flex-col gap-1 p-4 pt-8">
          <DrawerClose asChild>
            <a
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <House className="h-5 w-5" />
              <span>Home</span>
            </a>
          </DrawerClose>
          <DrawerClose asChild>
            <a
              href="/docs"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <BookOpen className="h-5 w-5" />
              <span>Docs</span>
            </a>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
