"use client";

import { useState } from "react";
import Link from "next/link";
import { CreatePostForm } from "@/components/create-post-form";
import { Feed } from "@/components/feed";
import { SearchBar } from "@/components/search-bar";
import { CategoryFilter } from "@/components/category-filter";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Flame,
	LogIn,
	MessageSquareText,
	Search,
	ShieldCheck,
} from "lucide-react";
import { useFirebase } from "@/lib/firebase-context";

export default function Home() {
	const { user, loading } = useFirebase();
	const [refreshKey, setRefreshKey] = useState(0);
	const [feedMode, setFeedMode] = useState<"latest" | "trending">("latest");
	const [selectedCategory, setSelectedCategory] = useState<
		string | undefined
	>();
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);

	const handlePostCreated = () => {
		setRefreshKey((prev) => prev + 1);
	};

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		setIsSearching(!!query);
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="animate-pulse">
					<div className="mb-4 h-12 w-48 rounded-lg bg-muted" />
					<div className="h-24 w-96 rounded-lg bg-muted" />
				</div>
			</div>
		);
	}

	return (
		<>
			<AppHeader />
			<main className="min-h-screen">
				<div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:py-8">
					<section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 px-6 py-8 shadow-xl shadow-primary/5 backdrop-blur sm:px-8">
						<div className="grid gap-8 lg:grid-cols-[1.45fr_0.75fr] lg:items-end">
							<div className="space-y-5">
								<div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
									<MessageSquareText className="h-3.5 w-3.5 text-primary" />
									Anonymous conversations for real campus life
								</div>
								<div className="space-y-3">
									<h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
										A quieter, safer place for what students actually want to say.
									</h2>
									<p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
										Ask awkward questions, share things you would never post publicly,
										and keep up with what your campus is really talking about.
									</p>
								</div>
								<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
									<div className="inline-flex items-center gap-2 rounded-full bg-secondary/45 px-3 py-2">
										<ShieldCheck className="h-4 w-4 text-primary" />
										Anonymous by default
									</div>
									<div className="inline-flex items-center gap-2 rounded-full bg-secondary/45 px-3 py-2">
										<Search className="h-4 w-4 text-primary" />
										Searchable campus pulse
									</div>
									<div className="inline-flex items-center gap-2 rounded-full bg-secondary/45 px-3 py-2">
										<Flame className="h-4 w-4 text-primary" />
										Moderated community feed
									</div>
								</div>
							</div>
							<div className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
								<div className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground">
									<p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">
										Today
									</p>
									<p className="mt-2 text-lg font-semibold">What people are whispering</p>
									<p className="mt-1 text-sm text-primary-foreground/80">
										Housing stress, professor rumors, club drama, exam survival tips.
									</p>
								</div>
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
									<div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
										<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
											Post
										</p>
										<p className="mt-1 text-sm font-medium">
											Write without exposing your identity
										</p>
									</div>
									<div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
										<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
											Discover
										</p>
										<p className="mt-1 text-sm font-medium">
											Filter by the categories students care about most
										</p>
									</div>
								</div>
							</div>
						</div>
					</section>

					{user ? (
						<CreatePostForm onPostCreated={handlePostCreated} />
					) : (
						<Card className="mb-2 border-border/70 bg-card/80 p-6 shadow-lg shadow-black/5">
							<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
								<div>
									<p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
										Join the conversation
									</p>
									<p className="mt-2 text-base text-muted-foreground">
										Want to share your thoughts anonymously?
									</p>
								</div>
								<Link href="/login">
									<Button className="rounded-full px-5">
										<LogIn className="mr-2 h-4 w-4" />
										Sign In to Post
									</Button>
								</Link>
							</div>
						</Card>
					)}

					<SearchBar onSearch={handleSearch} isLoading={isSearching} />

					{!isSearching && (
						<CategoryFilter
							selectedCategory={selectedCategory}
							onCategoryChange={setSelectedCategory}
						/>
					)}

					<section className="grid gap-4">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
									Forum feed
								</p>
								<h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
									{isSearching
										? "Search results"
										: selectedCategory
											? selectedCategory
											: feedMode === "trending"
												? "Trending whispers"
												: "Latest whispers"}
								</h3>
							</div>
							{!isSearching && !selectedCategory && (
								<div className="flex gap-2">
									<Button
										variant={feedMode === "latest" ? "default" : "outline"}
										className="rounded-full"
										onClick={() => setFeedMode("latest")}
									>
										Latest
									</Button>
									<Button
										variant={feedMode === "trending" ? "default" : "outline"}
										className="rounded-full"
										onClick={() => setFeedMode("trending")}
									>
										Trending
									</Button>
								</div>
							)}
						</div>
						<Feed
							key={refreshKey}
							category={selectedCategory}
							refresh={refreshKey > 0}
							searchQuery={isSearching ? searchQuery : undefined}
							mode={isSearching || selectedCategory ? "latest" : feedMode}
						/>
					</section>
				</div>
			</main>
		</>
	);
}
