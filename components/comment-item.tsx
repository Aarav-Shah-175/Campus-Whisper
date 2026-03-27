"use client";

import { useEffect, useState } from "react";
import { Comment, subscribeToReplies } from "@/lib/comment-service";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, Reply, Trash2, Flag } from "lucide-react";
import { CommentForm } from "./comment-form";
import { useFirebase } from "@/lib/firebase-context";
import {
	voteOnComment,
	VoteType as CommentVoteType,
} from "@/lib/comment-vote-service";
import { deleteComment } from "@/lib/comment-service";
import { ReportModal } from "./report-modal";
import { getAnonymousLabel } from "@/lib/anonymous-label";

interface CommentItemProps {
	comment: Comment;
	onCommentDeleted?: (commentId: string) => void;
	level?: number;
}

const MAX_NESTING_DEPTH = 2;

export function CommentItem({
	comment,
	onCommentDeleted,
	level = 0,
}: CommentItemProps) {
	const { user } = useFirebase();
	const [replies, setReplies] = useState<Comment[]>([]);
	const [showReplyForm, setShowReplyForm] = useState(false);
	const [isLoadingReplies, setIsLoadingReplies] = useState(false);
	const [isVoting, setIsVoting] = useState(false);
	const [upvotes, setUpvotes] = useState(comment.upvotes);
	const [downvotes, setDownvotes] = useState(comment.downvotes);
	const [userVote, setUserVote] = useState<CommentVoteType | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showReportModal, setShowReportModal] = useState(false);
	const [reportSuccess, setReportSuccess] = useState(false);

	useEffect(() => {
		if (level >= MAX_NESTING_DEPTH) return;

		setIsLoadingReplies(true);

		const unsubscribe = subscribeToReplies(
			comment.id,
			(fetchedReplies) => {
				setReplies(fetchedReplies);
				setIsLoadingReplies(false);
			},
			(error) => {
				console.error("Error loading replies:", error);
				setIsLoadingReplies(false);
			}
		);

		return unsubscribe;
	}, [comment.id, level]);

	const handleVote = async (voteType: CommentVoteType) => {
		if (!user) return;

		setIsVoting(true);
		try {
			await voteOnComment(comment.id, user.uid, voteType);

			if (userVote === voteType) {
				if (voteType === "upvote") {
					setUpvotes((prev) => prev - 1);
				} else {
					setDownvotes((prev) => prev - 1);
				}
				setUserVote(null);
			} else if (!userVote) {
				if (voteType === "upvote") {
					setUpvotes((prev) => prev + 1);
				} else {
					setDownvotes((prev) => prev + 1);
				}
				setUserVote(voteType);
			} else {
				if (userVote === "upvote") {
					setUpvotes((prev) => prev - 1);
					setDownvotes((prev) => prev + 1);
				} else {
					setUpvotes((prev) => prev + 1);
					setDownvotes((prev) => prev - 1);
				}
				setUserVote(voteType);
			}
		} catch (error) {
			console.error("Error voting:", error);
		} finally {
			setIsVoting(false);
		}
	};

	const handleDelete = async () => {
		if (!user || comment.userId !== user.uid) return;

		if (!confirm("Are you sure you want to delete this comment?")) return;

		setIsDeleting(true);
		try {
			await deleteComment(comment.id, user.uid);
			onCommentDeleted?.(comment.id);
		} catch (error) {
			console.error("Error deleting comment:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	const createdAt = comment.createdAt?.toDate?.() || new Date();
	const canReply = level < MAX_NESTING_DEPTH;
	const showRepliesSection = canReply && replies.length > 0;
	const authorLabel = getAnonymousLabel(comment.userId, comment.postId);

	return (
		<div className={`${level > 0 ? "ml-4 md:ml-8" : ""}`}>
			<Card className="p-4 mb-3">
				<div className="flex justify-between items-start mb-2">
					<span className="text-xs text-muted-foreground">
						{authorLabel} - {formatDistanceToNow(createdAt, { addSuffix: true })}
					</span>
					<div className="flex gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowReportModal(true)}
							title="Report comment"
						>
							<Flag className="w-4 h-4" />
						</Button>
						{user?.uid === comment.userId && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleDelete}
								disabled={isDeleting}
								className="text-destructive hover:bg-destructive/10"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						)}
					</div>
				</div>

				{reportSuccess && (
					<div className="mb-2 p-2 bg-green-500/10 text-green-700 text-xs rounded">
						Thank you for reporting. Our team will review this content.
					</div>
				)}

				<p className="text-foreground mb-3 leading-relaxed whitespace-pre-wrap break-words">
					{comment.content}
				</p>

				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleVote("upvote")}
						disabled={isVoting}
						className={
							userVote === "upvote" ? "bg-primary text-primary-foreground" : ""
						}
					>
						<ThumbsUp className="w-4 h-4 mr-1" />
						{upvotes}
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleVote("downvote")}
						disabled={isVoting}
						className={
							userVote === "downvote"
								? "bg-destructive text-destructive-foreground"
								: ""
						}
					>
						<ThumbsDown className="w-4 h-4 mr-1" />
						{downvotes}
					</Button>

					{canReply && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowReplyForm(!showReplyForm)}
						>
							<Reply className="w-4 h-4 mr-1" />
							Reply
						</Button>
					)}
				</div>
			</Card>

			{showReplyForm && (
				<div className="mb-4">
					<CommentForm
						postId={comment.postId}
						parentCommentId={comment.id}
						onCommentAdded={() => {
							setShowReplyForm(false);
						}}
						isReply
						onCancel={() => setShowReplyForm(false)}
					/>
				</div>
			)}

			{showRepliesSection && (
				<div className="mt-3">
					{isLoadingReplies ? (
						<div className="text-sm text-muted-foreground">
							Loading replies...
						</div>
					) : (
						replies.map((reply) => (
							<CommentItem
								key={reply.id}
								comment={reply}
								onCommentDeleted={(deletedReplyId) => {
									setReplies((currentReplies) =>
										currentReplies.filter((reply) => reply.id !== deletedReplyId)
									);
								}}
								level={level + 1}
							/>
						))
					)}
				</div>
			)}

			{showReportModal && (
				<ReportModal
					contentId={comment.id}
					contentType="comment"
					reportedUserId={comment.userId}
					reportedUserIsAnonymous={comment.authorIsAnonymous}
					onClose={() => setShowReportModal(false)}
					onSuccess={() => {
						setReportSuccess(true);
						setTimeout(() => setReportSuccess(false), 5000);
					}}
				/>
			)}
		</div>
	);
}
