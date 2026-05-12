import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JSX } from "astro/jsx-runtime";
import { useEffect, useState } from "react";
import { loginAll, logoutAll, whoamiAll } from "@utils/auth";
import { toast } from "sonner";

/**
 * The returned element must be wrapped in a CookiesProvider element. Assumes there is a valid toaster to use.
 * @TODO React Hook Form
 * @returns Login Dialog Button
 */
export default function LoginDialog(): JSX.Element {
  const [username, setUsername] = useState<string>();
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    setLoading(true);
    whoamiAll()
      .then((value) => {
        setUsername(value);
        setLoading(false);
      })
      .catch((reason: any) => {
        console.error("Who am I failed.", reason);
        setLoading(false);
        toast(`An error occured while identifying: ${reason}`);
      });
  }, []);
  function onResetLoginInfo() {
    if (loading) return;
    setLoading(true);
    logoutAll()
      .then(() => {
        toast(`Goodbye ${username}.`);
      })
      .catch((reason) => {
        toast(`An error occured while logging out: ${reason}`);
      })
      .finally(() => {
        setLoading(false);
        setUsername(undefined);
      });
  }
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (loading) return;
    setLoading(true);
    event.preventDefault(); // prevent dialog from closing automatically
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string | null;
    const password = formData.get("password") as string | null;
    if (username === null || password === null)
      throw Error("Unexpectedly null username or password.");
    loginAll(username, password)
      .then(() => {
        toast(`Login succeeded! Welcome back ${username}.`);
        setUsername(username);
      })
      .catch((reason) => {
        toast(`Login failed: ${reason}`);
        setUsername(undefined);
      })
      .finally(() => {
        setLoading(false);
      });
  }
  if (loading) {
    return null;
  }
  return (
    <>
      {username ? (
        <>
          <p>Welcome back, {username}!</p>
          <Button onClick={onResetLoginInfo} type="button">
            Log Out
          </Button>
        </>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" type="button">
              Login
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={onSubmit}>
              <DialogHeader>
                <DialogTitle>Login</DialogTitle>
                <DialogDescription>
                  ONLY ADMIN LOGIN IS SUPPORTED RIGHT NOW
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" defaultValue="" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" defaultValue="" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Login</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
