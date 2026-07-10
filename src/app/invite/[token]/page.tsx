import { acceptInvite } from "@/app/actions/org";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const session = await auth();
  const token = params.token;

  async function handleAccept() {
    "use server";
    try {
      await acceptInvite(token);
      redirect("/dashboard");
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center p-8 border rounded shadow">
          <h1 className="text-2xl font-bold mb-4">You&apos;ve been invited!</h1>
          <p className="mb-4">
            Please log in or sign up to accept this invitation.
          </p>
          <a href="/login" className="text-blue-500 hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        action={handleAccept}
        className="text-center border p-8 rounded shadow max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-4">Accept Invitation</h1>
        <p className="mb-6">You are logged in as {session.user.email}</p>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Accept Invite
        </button>
      </form>
    </div>
  );
}
