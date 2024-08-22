"use client";

import { Button } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/api/api";
import { useAuthStore } from "~/store/auth.store";

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await api.post("/auth/sign-in", { username });
      return response.data.access_token;
    },
    onSuccess: (accessToken) => {
      setAccessToken(accessToken);
      router.push("/assistant");
    },
  });

  function handleLogin() {
    loginMutation.mutate(username);
  }

  function handlePressEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleLogin();
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center">
      <div className="container flex h-full flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="flex justify-center p-4">
            <h1 className="font-bold text-2xl">Login</h1>
          </CardHeader>
          <CardBody className="space-y-4 p-4">
            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              autoFocus
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handlePressEnter}
            />
            <Button color="primary" onPress={handleLogin} className="w-full">
              Login
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
