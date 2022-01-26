import LiveShoppingCurrentStateBoard from '@project-lc/components-web-bc/LiveShoppingCurrentStateBoard';
import { useBroadcasterLiveShoppingList, useProfile } from '@project-lc/hooks';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export function LiveShoppingCurrentState(): JSX.Element {
  const router = useRouter();
  const liveShoppingId = Number(router.query.liveShoppingId);

  const { data: profileData } = useProfile();
  const { data: liveShoppingList } = useBroadcasterLiveShoppingList({
    broadcasterId: profileData?.id,
  });

  const { title } = useMemo(() => {
    if (!liveShoppingList) return { title: '' };
    const currentLiveShopping = liveShoppingList.find(
      (shopping) => shopping.id === liveShoppingId,
    );
    if (!currentLiveShopping) return { title: '' };
    const liveShoppingTitle = currentLiveShopping.liveShoppingName || '';
    return {
      title: liveShoppingTitle,
    };
  }, [liveShoppingId, liveShoppingList]);

  return <LiveShoppingCurrentStateBoard liveShoppingId={liveShoppingId} title={title} />;
}

export default LiveShoppingCurrentState;
