import AuditoriumStructure from "@/components/AuditoriumStructure";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";

interface newSession extends Session {
  user: {
    id: number;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
  };
}

export default async function Slots() {
  const session: newSession | null = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  return (
    <div className="mt-12 text-white">
      <AuditoriumStructure userId={userId} />
    </div>
  );
}
