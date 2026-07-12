import { useFollowUser, useUnfollowUser, getGetUserProfileQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export function FollowButton({ userId, isFollowing }: { userId: string; isFollowing: boolean }) {
  const queryClient = useQueryClient();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const pending = followUser.isPending || unfollowUser.isPending;

  const handleClick = async () => {
    try {
      if (isFollowing) {
        await unfollowUser.mutateAsync({ userId });
      } else {
        await followUser.mutateAsync({ userId });
      }
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
    } catch (err) {
      toast.error(isFollowing ? 'Failed to unfollow.' : 'Failed to follow.');
    }
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      className="rounded-none font-mono text-xs uppercase tracking-widest gap-2"
      disabled={pending}
      onClick={handleClick}
    >
      {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
