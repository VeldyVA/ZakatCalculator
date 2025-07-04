
export async function sendToAI(fileContent: string, zakatType: 'harta' | 'perusahaan' | 'profesi') {
  const response = await fetch('/api/process-excel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileContent, zakatType }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to process file with AI');
  }

  return await response.json();
}
