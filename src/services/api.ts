updateStore: async (storeId: string, data: { name: string; address: string }) => {
    try {
      const response = await api.put(`/api/shopkeeper/stores/${storeId}`, data);
      return response;
    } catch (error) {
      handleApiError(error, 'Update store failed');
      throw error;
    }
  },