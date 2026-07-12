"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { addCommentAction } from "@/server/contracts/comments";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ClauseCommentThreadProps {
  clauseId: string;
  contractId: string;
  orgId: string;
  initialComments: Comment[];
}

export function ClauseCommentThread({
  clauseId,
  contractId,
  orgId,
  initialComments,
}: ClauseCommentThreadProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    initialComments,
    (state: Comment[], newComment: Comment) => [...state, newComment]
  );

  const handleSubmit = async (formData: FormData) => {
    const content = formData.get("content") as string;
    if (!content || !content.trim()) return;

    formRef.current?.reset();

    const newComment: Comment = {
      id: Math.random().toString(), // temporary id
      content: content.trim(),
      created_at: new Date(),
      user: {
        id: "optimistic",
        name: "You",
        email: "",
      },
    };

    startTransition(async () => {
      addOptimisticComment(newComment);
      const result = await addCommentAction(clauseId, content, contractId, orgId);
      
      if (!result.success) {
        toast.error("Failed to add comment", {
          description: result.error || "Please try again later.",
        });
      } else {
        toast.success("Comment added");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {optimisticComments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-2">
            No comments yet.
          </p>
        ) : (
          optimisticComments.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {comment.user.name?.charAt(0).toUpperCase() || comment.user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">
                    {comment.user.name || comment.user.email.split("@")[0]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form ref={formRef} action={handleSubmit} className="flex gap-2 items-start mt-2 relative">
        <textarea
          name="content"
          placeholder="Reply or add a note..."
          className="flex-1 min-h-[40px] max-h-[120px] resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          disabled={isPending}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={isPending}
          className="shrink-0 rounded-full w-8 h-8 self-end mb-1"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
