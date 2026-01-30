import { CACHE_URL } from "astro:env/client";
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
import { useCookies, CookiesProvider } from "react-cookie";
import { getCSRFToken } from "@/utils/auth";
import { toast } from "sonner";

/**
 * The returned element must be wrapped in a CookiesProvider element.
 * @todo expand to not just admin user
 * @todo use React Hook Form or similar
 * @returns Login Dialog Button
 */
export default function LoginDialog(): JSX.Element {
  return (
    <CookiesProvider>
      <LoginDialogContents />
    </CookiesProvider>
  );
}

function LoginDialogContents(): JSX.Element {
  const [isMounted, setIsMounted] = useState(false);
  const [usernameCookie, setUsernameCookie, removeUsernameCookie] = useCookies([
    "username",
  ]);
  const [passwordCookie, setPasswordCookie, removePasswordCookie] = useCookies([
    "password",
  ]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  function onResetLoginInfo() {
    removeUsernameCookie("username", {
      path: "/",
      sameSite: "lax",
    });
    removePasswordCookie("password", {
      path: "/",
      sameSite: "lax",
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // prevent dialog from closing automatically

    const formData = new FormData(event.currentTarget);
    setUsernameCookie("username", formData.get("username"), {
      path: "/",
      sameSite: "lax",
    });
    setPasswordCookie("password", formData.get("password"), {
      path: "/",
      sameSite: "lax",
    });

    getCSRFToken(CACHE_URL)
      .then((csrftoken: string) => {
        fetch(`${CACHE_URL}/auth`, {
          method: "POST",
          body: JSON.stringify({
            username: formData.get("username"),
            password: formData.get("password"),
          }),
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "X-CSRFToken": csrftoken,
          },
        }).then((response) => {
          response.text().then((text: string) => {
            if (response.ok) {
              toast(`Successfully authenticated!`);
            } else {
              toast(`Error while authenticating: ${text}`);
            }
          });
        });
      })
      .catch((reason: string) => {
        toast(`Something went wrong while trying to authenticate: ${reason}`);
      });
  }

  return (
    <div>
      {usernameCookie.username && passwordCookie.password ? (
        <Button onClick={onResetLoginInfo}>Log Out</Button>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Login</Button>
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
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Login</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
