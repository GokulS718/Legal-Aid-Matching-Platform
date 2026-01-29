import React from "react";
import { createSession } from "../../api/chatApi";
import { toast } from "sonner";

function NgoCard({ ngo, setActivePage, setSelectedRecipient }) {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-lg shadow border border-gray-200 dark:border-[#333] flex items-center justify-between transition-colors">
      <div>
        <div className="font-semibold text-gray-900 dark:text-white transition-colors">{ngo.ngoName}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
          {ngo.city}, {ngo.state}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-500 mt-1 transition-colors">{ngo.ngoType}</div>
        <div className="text-sm text-gray-500 dark:text-gray-500 mt-1 transition-colors">
          {ngo.contact} • {ngo.email}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        {ngo.verificationStatus && (
          <span
            className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 transition-colors"
          >
            Verified NGO
          </span>
        )}

        <button
          onClick={async () => {
            try {
              const res = await createSession(null, ngo.id, "NGO");
              const session = res.data;
              if (session && session.id) {
                setSelectedRecipient({
                  type: "ngo",
                  id: ngo.id,
                  name: ngo.ngoName,
                  sessionId: session.id
                });
                setActivePage("messages");
              } else {
                toast.error("Failed to create chat session.");
              }
            } catch (err) {
              console.error("Failed to start chat:", err);
              const errorMsg = err.response?.data?.message || err.message || "Failed to start conversation.";
              toast.error(errorMsg);
            }
          }}
          className="bg-teal-700 dark:bg-teal-600 hover:bg-teal-800 dark:hover:bg-teal-700 text-white px-3 py-1 rounded mt-2 transition-colors"
        >
          Message
        </button>
      </div>
    </div>
  );
}

export default function CitizenFindNgo({
  ngos,
  setActivePage,
  setSelectedRecipient,
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white transition-colors">Find NGOs</h2>
      <div className="grid gap-4">
        {ngos
          .filter(n => n.isApproved) // Only show approved NGOs
          .map((ngo) => (
            <NgoCard
              key={ngo.id}
              ngo={ngo}
              setActivePage={setActivePage}
              setSelectedRecipient={setSelectedRecipient}
            />
          ))}
      </div>
    </div>
  );
}
