const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export type SheetRow = Record<string, unknown>;

export async function getSheetData(
    sheetName: string,
    monthId: string
): Promise<SheetRow[]> {

    if (!sheetName) {
        throw new Error("Sheet name is required.");
    }

    if (!monthId) {
        throw new Error("Month ID is required.");
    }

    const url =
        `${API_BASE_URL}/sheets-entry/` +
        `${encodeURIComponent(sheetName)}/month/` +
        `${encodeURIComponent(monthId)}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        let message = `Server returned ${response.status}`;

        try {
            const errorData = await response.json();

            if (errorData?.message) {
                message = errorData.message;
            }
        } catch {
            // Ignore invalid error response
        }

        throw new Error(message);
    }

    const result = await response.json();

    const data = Array.isArray(result)
        ? result
        : result?.data;

    if (!Array.isArray(data)) {
        throw new Error(
            "Backend response does not contain a valid sheet dataset."
        );
    }

    return data;
}