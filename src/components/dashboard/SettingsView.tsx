"use client";

import { useEffect, useReducer, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar, useSignOutToHome } from "@/components/account/AccountMenu";
import { useAuth } from "@/lib/auth";
import { submitIdle, submitReducer } from "@/lib/machines/submit";
import { profileApi } from "@/lib/api/resources";
import { ApiError, api } from "@/lib/api/client";

/**
 * Profile settings saved through the Django API.
 * Submission state reuses the submit machine (lib/machines/submit.ts).
 */
export default function SettingsView() {
  const { account } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(account?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [googleLinked, setGoogleLinked] = useState<boolean | null>(null);
  const [googleError, setGoogleError] = useState("");
  const [linking, setLinking] = useState(false);
  const [roles, setRoles] = useState(account?.roles ?? []);
  const [addRole, setAddRole] = useState<"BUSINESS"|"DRIVER">(account?.role==="BUSINESS"?"DRIVER":"BUSINESS");
  const [companyName, setCompanyName] = useState("");
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceNotice, setWorkspaceNotice] = useState("");
  const [state, dispatch] = useReducer(submitReducer, submitIdle);
  const signOutToHome = useSignOutToHome();
  useEffect(()=>{api<{google_linked:boolean;roles:Array<"ADMIN"|"BUSINESS"|"DRIVER">}>("/auth/profile/").then((result)=>{setGoogleLinked(result.google_linked);setRoles(result.roles);}).catch(()=>setGoogleLinked(false));},[]);
  if (!account) return null;
  const saving = state.status === "submitting";

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fullName = name.trim();
    if (!fullName) return;
    dispatch({ type: "SUBMIT" });
    const [first_name, ...rest] = fullName.split(/\s+/);
    try {
      await profileApi.update({ first_name, last_name: rest.join(" ") });
      window.dispatchEvent(new Event("fleetcast-auth-changed"));
      dispatch({ type: "RESOLVE" });
    } catch (error) {
      dispatch({ type: "REJECT", message: error instanceof ApiError ? error.message : "We couldn't save your name. Please try again." });
    }
  };

  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch({ type: "SUBMIT" });
    try {
      await profileApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword(""); setNewPassword("");
      dispatch({ type: "RESOLVE" });
    } catch (error) {
      dispatch({ type: "REJECT", message: error instanceof ApiError ? error.message : "Password could not be changed." });
    }
  };

  const linkGoogle = async()=>{setLinking(true);setGoogleError("");try{const result=await api<{authorization_url:string}>("/auth/google/link/start/",{method:"POST",body:JSON.stringify({})});window.location.assign(result.authorization_url);}catch(error){setGoogleError(error instanceof ApiError?error.message:"Google account linking could not be started.");setLinking(false);}};

  const addWorkspace = async()=>{
    setWorkspaceBusy(true);setWorkspaceError("");setWorkspaceNotice("");
    try{
      const result=await api<{user:{role:"ADMIN"|"BUSINESS"|"DRIVER";roles:Array<"ADMIN"|"BUSINESS"|"DRIVER">}}>("/auth/workspaces/",{method:"POST",body:JSON.stringify({role:addRole,...(addRole==="BUSINESS"?{company_name:companyName.trim()}:{})})});
      setRoles(result.user.roles);setWorkspaceNotice(`${addRole==="BUSINESS"?"Advertiser":"Fleet owner"} workspace added. This account now uses that workspace.`);
      window.dispatchEvent(new Event("fleetcast-auth-changed"));router.replace("/dashboard");router.refresh();
    }catch(error){setWorkspaceError(error instanceof ApiError?error.message:"Workspace could not be added.");}
    finally{setWorkspaceBusy(false);}
  };

  return (
    <div className="dview">
      <section className="dview__hello">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile and how you sign in.</p>
        </div>
      </section>

      <div className="dview__grid">
        {account.role!=="ADMIN"&&<section className="dcard dcard--wide" aria-labelledby="workspaces-title">
          <header className="dcard__head"><h2 id="workspaces-title">Workspaces</h2></header>
          <p>Your email and sign-in stay the same. Each workspace has its own profile and permissions.</p>
          <p><strong>Enabled:</strong> {roles.map((role)=>role==="BUSINESS"?"Advertiser":role==="DRIVER"?"Fleet owner":"Administrator").join(" · ")}</p>
          {roles.length<2&&<div className="dform__fields">
            <label className="field"><span>Add workspace</span><select value={addRole} onChange={(e)=>setAddRole(e.target.value as "BUSINESS"|"DRIVER")}><option value={account.role==="BUSINESS"?"DRIVER":"BUSINESS"}>{account.role==="BUSINESS"?"Fleet owner / Driver":"Business / Advertiser"}</option></select></label>
            {addRole==="BUSINESS"&&<label className="field"><span>Company name*</span><input value={companyName} onChange={(e)=>setCompanyName(e.target.value)} required autoComplete="organization"/></label>}
            {workspaceError&&<p className="form__error" role="alert">{workspaceError}</p>}{workspaceNotice&&<p className="dform__ok" role="status">{workspaceNotice}</p>}
            <div className="dform__actions"><button className="btn btn--navy btn--sm" type="button" disabled={workspaceBusy||(addRole==="BUSINESS"&&!companyName.trim())} onClick={()=>void addWorkspace()}>{workspaceBusy?"Adding workspace…":"Add workspace"}</button></div>
          </div>}
          {roles.length>1&&<p className="dform__hint">Use the workspace selector in the top bar to switch between advertiser and fleet owner views.</p>}
        </section>}
        <section className="dcard dcard--wide" aria-labelledby="profile-title">
          <header className="dcard__head">
            <h2 id="profile-title">Profile</h2>
          </header>
          <form className="dform" onSubmit={save} data-status={state.status}>
            <div className="dform__who">
              <Avatar account={account} size={56} />
              <div>
                <strong>{account.name}</strong>
                <span>{account.email}</span>
              </div>
            </div>
            <label className="field">
              <span>Full name</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (state.status !== "idle") dispatch({ type: "RESET" });
                }}
                autoComplete="name"
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={account.email} readOnly aria-readonly="true" />
            </label>
            <p className="dform__hint">
              Signed in with <strong>{account.provider === "google" ? "Google" : "email and password"}</strong>.
            </p>
            {state.status === "error" && (
              <p className="form__error" role="alert">
                {state.message}
              </p>
            )}
            {state.status === "success" && (
              <p className="dform__ok" role="status">
                Saved.
              </p>
            )}
            <div className="dform__actions">
              <button type="submit" className="btn btn--navy btn--sm" disabled={saving || name.trim() === account.name}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </section>

        <section className="dcard dcard--wide" aria-labelledby="password-title">
          <header className="dcard__head"><h2 id="password-title">Change password</h2></header>
          <form className="dform" onSubmit={changePassword}>
            <label className="field"><span>Current password</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} required /></label>
            <label className="field"><span>New password</span><input type="password" autoComplete="new-password" minLength={10} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required /></label>
            {state.status === "error" && <p className="form__error" role="alert">{state.message}</p>}
            {state.status === "success" && <p className="dform__ok" role="status">Password changed. Sign in again with your new password.</p>}
            <div className="dform__actions"><button type="submit" className="btn btn--navy btn--sm" disabled={saving || !currentPassword || newPassword.length < 10}>{saving ? "Saving…" : "Update password"}</button></div>
          </form>
        </section>

        <section className="dcard dcard--wide" aria-labelledby="session-title">
          <header className="dcard__head">
            <h2 id="session-title">Session</h2>
          </header>
          <p className="dform__hint">Sign out of Fleetcast on this device.</p>
          <div className="dform__actions">
            <button type="button" className="btn btn--sm dform__out" onClick={() => void signOutToHome()}>
              Sign out
            </button>
          </div>
        </section>

        <section className="dcard dcard--wide" aria-labelledby="google-title">
          <header className="dcard__head"><h2 id="google-title">Google account</h2></header>
          <p className="dform__hint">{googleLinked===null?"Checking connection…":googleLinked?"A verified Google identity is linked to this account.":"Link the verified Google account that uses this email address."}</p>
          {googleError&&<p className="form__error" role="alert">{googleError}</p>}
          {!googleLinked&&<div className="dform__actions"><button type="button" className="btn btn--navy btn--sm" onClick={()=>void linkGoogle()} disabled={linking||googleLinked===null}>{linking?"Opening Google…":"Link Google account"}</button></div>}
        </section>
      </div>
    </div>
  );
}
