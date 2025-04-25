import {
    UserRound,
} from "lucide-react";

export default function OwnerDetailsPage() {
    return (
        <div className="flex flex-col gap-6 h-full bg-white rounded-lg border border-[#0e5f97]/20">
            <div className="flex flex-col gap-6 items-center justify-center h-full p-4">
                <UserRound className="w-20 h-20 text-gray-300 animate-pulse" />

                <div className="flex flex-col gap-2 items-center justify-center">
                    <span className="text-lg font-semibold text-[#0e5f97]">
                        No Owner Details Available
                    </span>
                    <span className="text-gray-500 text-sm text-center">
                        Link this machine to your web account to view owner details.
                    </span>
                </div>
            </div>
        </div>
    )
}