import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useUserAccess() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user?.email) {
        const { data: acceso } = await supabase
          .from("accesos")
          .select("activo")
          .eq("email", user.email.toLowerCase())
          .single();

        setHasAccess(!!acceso?.activo);
      } else {
        setHasAccess(false);
      }

      setLoading(false);
    }

    checkAccess();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { user, hasAccess, loading };
  }