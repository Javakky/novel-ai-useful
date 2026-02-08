"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { KeyRound, Eye, EyeOff } from "lucide-react";

export function TokenSetting() {
  const { apiToken, setApiToken } = useAppStore();
  const [showToken, setShowToken] = useState(false);
  const [tempToken, setTempToken] = useState(apiToken);

  // Zustand persist の hydration 後にストアの値を同期する
  useEffect(() => {
    setTempToken(apiToken);
  }, [apiToken]);

  const handleSave = () => {
    setApiToken(tempToken.trim());
  };

  return (
    <Card title="API トークン設定">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-nai-muted">
          Novel AI のアクセストークンを入力してください。トークンはブラウザに保存され、サーバーには保存されません。
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showToken ? "text" : "password"}
              value={tempToken}
              onChange={(e) => setTempToken(e.target.value)}
              placeholder="pst-..."
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-nai-muted hover:text-nai-text"
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Button onClick={handleSave} size="md">
            <KeyRound size={16} className="mr-1" />
            保存
          </Button>
        </div>
        {apiToken && (
          <p className="text-xs text-green-400">トークン設定済み</p>
        )}
      </div>
    </Card>
  );
}
