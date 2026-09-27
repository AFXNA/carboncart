import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function AuthPage() {
  const { signUp, logIn, demoLogin } = useApp();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (signup && form.password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      await (signup ? signUp(form.name, form.email, form.password) : logIn(form.email, form.password));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="card auth-card" onSubmit={submit}>
      <h2>{signup ? "Create your account" : "Welcome back"}</h2>
      <p className="mute">{signup ? "Track the resources your choices save." : "Log in to see your impact."}</p>
      {signup && (
        <label>Name<input type="text" value={form.name} onChange={set("name")} autoComplete="name" required /></label>
      )}
      <label>Email<input type="email" value={form.email} onChange={set("email")} autoComplete="email" required /></label>
      <label>Password
        <input type="password" value={form.password} onChange={set("password")} autoComplete={signup ? "new-password" : "current-password"} required />
      </label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="primary" type="submit" disabled={busy}>{signup ? "Sign up" : "Log in"}</button>
      <p className="mute">
        {signup ? "Already have an account? " : "New here? "}
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(signup ? "login" : "signup"); setError(""); }}>
          {signup ? "Log in" : "Sign up"}
        </a>
      </p>
      <button type="button" onClick={demoLogin}>Continue as demo user</button>
    </form>
  );
}
