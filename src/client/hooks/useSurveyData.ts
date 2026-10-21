import { useState, useEffect, useCallback, useMemo } from 'react';
import { SurveyResponse, SurveyStats } from '../types';
import { useWebSocketSync } from './useWebSocketSync';

const EMPTY_STATS: SurveyStats = {
  totalCount: 0,
  totalRegionVotes: 0,
  regionVotes: {
    '東京及近郊': 0,
    '京阪神': 0,
    '北海道': 0,
    '福岡九州': 0,
    '青森東北': 0,
    '四國瀨戶內': 0
  },
  daysVotes: {
    '5 天': 0,
    '7 天': 0,
    '9 天': 0
  },
  styleVotes: {
    '都市繁華': 0,
    '慢生活風景': 0,
    '城鄉各半': 0
  },
  transportVotes: {
    publicTransport: 0,
    rentalCar: 0,
    willingDrivers: 0
  },
  intentVotes: {
    '一定參加': 0,
    '高機率參加': 0,
    '觀望中': 0
  }
};

export function useSurveyData() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    try {
      const res = await fetch('/api/responses');
      if (!res.ok) {
        throw new Error(`伺服器回應錯誤 (${res.status})`);
      }
      const data = await res.json();
      setResponses(Array.isArray(data.data) ? data.data : []);
      setError(null);
    } catch (err: any) {
      console.error('Fetch responses failed:', err);
      setError(err.message || '無法取得填答資料');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Compute stats on the fly from responses to guarantee 100% synchronization and prevent any desync
  const stats: SurveyStats = useMemo(() => {
    if (!responses || responses.length === 0) {
      return EMPTY_STATS;
    }

    const regionVotes: Record<string, number> = {
      '東京及近郊': 0,
      '京阪神': 0,
      '北海道': 0,
      '福岡九州': 0,
      '青森東北': 0,
      '四國瀨戶內': 0
    };
    const daysVotes: Record<string, number> = {
      '5 天': 0,
      '7 天': 0,
      '9 天': 0
    };
    const styleVotes: Record<string, number> = {
      '都市繁華': 0,
      '慢生活風景': 0,
      '城鄉各半': 0
    };
    const intentVotes: Record<string, number> = {
      '一定參加': 0,
      '高機率參加': 0,
      '觀望中': 0
    };
    let publicTransport = 0;
    let rentalCar = 0;
    let willingDrivers = 0;
    let totalRegionVotes = 0;

    for (const r of responses) {
      if (daysVotes[r.days] !== undefined) daysVotes[r.days]++;
      if (styleVotes[r.style] !== undefined) styleVotes[r.style]++;
      if (intentVotes[r.intent] !== undefined) intentVotes[r.intent]++;
      if (r.transport === '大眾運輸為主') publicTransport++;
      if (r.transport === '租車自駕') rentalCar++;
      if (r.driver === 1) willingDrivers++;

      if (Array.isArray(r.regions)) {
        for (const reg of r.regions) {
          if (regionVotes[reg] !== undefined) {
            regionVotes[reg]++;
            totalRegionVotes++;
          }
        }
      }
    }

    return {
      totalCount: responses.length,
      totalRegionVotes,
      regionVotes,
      daysVotes,
      styleVotes,
      transportVotes: {
        publicTransport,
        rentalCar,
        willingDrivers
      },
      intentVotes
    };
  }, [responses]);

  // WebSocket event listeners
  const handleNewResponse = useCallback((newResp: SurveyResponse) => {
    setResponses((prev) => {
      // Avoid duplicate insertion
      if (prev.some((item) => item.id === newResp.id)) {
        return prev;
      }
      return [newResp, ...prev];
    });
  }, []);

  const handleUpdateResponse = useCallback((updatedResp: SurveyResponse) => {
    setResponses((prev) =>
      prev.map((item) => (item.id === updatedResp.id ? updatedResp : item))
    );
  }, []);

  const handleDeleteResponse = useCallback(({ id }: { id: string }) => {
    setResponses((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const { status: wsStatus } = useWebSocketSync({
    onNewResponse: handleNewResponse,
    onUpdateResponse: handleUpdateResponse,
    onDeleteResponse: handleDeleteResponse,
    onRefreshNeeded: fetchResponses
  });

  // Initial load
  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // Polling fallback when WebSocket is not connected
  useEffect(() => {
    if (wsStatus === 'connected') return;

    const interval = setInterval(() => {
      fetchResponses();
    }, 15000);

    return () => clearInterval(interval);
  }, [wsStatus, fetchResponses]);

  // Submit response
  const submitResponse = async (formData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || '提交失敗，請檢查填寫欄位' };
      }

      // Add to local state immediately if not already added by WS
      if (data.data) {
        handleNewResponse(data.data);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '網路連線失敗，請稍候重試' };
    }
  };

  // Update response (Admin only)
  const updateResponse = async (
    id: string,
    formData: any,
    adminKey: string
  ): Promise<{ success: boolean; error?: string; data?: SurveyResponse }> => {
    try {
      const res = await fetch(`/api/responses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminKey
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || '修改失敗' };
      }
      if (data.data) {
        handleUpdateResponse(data.data);
      }
      return { success: true, data: data.data };
    } catch (err: any) {
      return { success: false, error: err.message || '網路連線失敗' };
    }
  };

  // Verify Admin Password
  const verifyAdminPassword = async (
    password: string
  ): Promise<{ valid: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { valid: false, error: data.error || '管理員密碼錯誤' };
      }
      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || '網路連線失敗' };
    }
  };

  // Delete response (Admin only)
  const deleteResponse = async (id: string, adminKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/responses/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': adminKey
        }
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || '刪除失敗' };
      }
      handleDeleteResponse({ id });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '網路連線失敗' };
    }
  };

  return {
    responses,
    stats,
    isLoading,
    error,
    wsStatus,
    refresh: fetchResponses,
    submitResponse,
    updateResponse,
    deleteResponse,
    verifyAdminPassword
  };
}
