import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export function useUserAccess() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

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