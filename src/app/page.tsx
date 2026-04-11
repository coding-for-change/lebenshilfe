"use client";

import { useState } from "react";
import { authClient } from "@/app/_lib/auth-client";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) setError(res.error.message ?? "Login failed");
      } else {
        const res = await authClient.signUp.email({ email, password, name });
        if (res.error) setError(res.error.message ?? "Sign up failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  if (isPending) {
    return (
      <div style={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>✅ Authenticated!</h1>
          <div style={styles.info}>
            <p>
              <strong>Name:</strong> {session.user.name}
            </p>
            <p>
              <strong>Email:</strong> {session.user.email}
            </p>
            <p>
              <strong>Role:</strong> {session.user.role ?? "user"}
            </p>
            <p>
              <strong>User ID:</strong> <code>{session.user.id}</code>
            </p>
          </div>
          <button
            onClick={handleSignOut}
            style={styles.buttonSecondary}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{isLogin ? "Sign In" : "Sign Up"}</h1>

        <form
          onSubmit={handleSubmit}
          style={styles.form}
        >
          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? "..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          style={styles.toggle}
        >
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
    background: "#f5f5f5",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "2.5rem",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  title: {
    margin: "0 0 1.5rem",
    fontSize: "1.5rem",
    textAlign: "center" as const,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: "1rem",
    outline: "none",
  },
  button: {
    padding: "0.75rem",
    borderRadius: 8,
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  buttonSecondary: {
    padding: "0.75rem",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    fontSize: "1rem",
    cursor: "pointer",
    width: "100%",
  },
  toggle: {
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    fontSize: "0.875rem",
    marginTop: "1rem",
    textAlign: "center" as const,
    display: "block",
    width: "100%",
  },
  error: {
    color: "#e00",
    fontSize: "0.875rem",
    margin: 0,
  },
  info: {
    background: "#f9f9f9",
    borderRadius: 8,
    padding: "1rem",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    lineHeight: 1.8,
  },
};
