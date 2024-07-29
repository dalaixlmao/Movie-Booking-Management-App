import AuditoriumStructure from "@/components/AuditoriumStructure"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
export default async function(){
    const session = await getServerSession(authOptions);
    const userId = Number(session.user.id);

    return <div className="mt-12 text-white">
        <AuditoriumStructure userId = {userId} />
    </div>
}