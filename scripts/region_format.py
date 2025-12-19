import json
import os

FOLDER_PATH = "src/renderer/src/data/lgu"

# Allowed keys at ANY level
ALLOWED_KEYS = {
    "slug",
    "province",
    "provinces",
    "town",
    "towns",
    "city",
    "cities",
    "municipality",
    "municipalities",
    "zip_code",
    "zip_codes",
}

# Keys that must ALWAYS be removed
REMOVE_KEYS = {
    "mayor",
    "vice_mayor",
    "name",
    "contact",
}


def clean_node(node):
    """
    Recursively clean dicts and lists:
    - Remove forbidden keys
    - Keep only allowed keys
    """
    if isinstance(node, dict):
        cleaned = {}

        for key, value in node.items():
            if key in REMOVE_KEYS:
                continue

            if key in ALLOWED_KEYS:
                cleaned[key] = clean_node(value)

        return cleaned

    elif isinstance(node, list):
        return [clean_node(item) for item in node if isinstance(item, (dict, list))]

    else:
        return node


for filename in os.listdir(FOLDER_PATH):
    if not filename.lower().endswith(".json"):
        continue

    file_path = os.path.join(FOLDER_PATH, filename)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        cleaned_data = clean_node(data)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(cleaned_data, f, indent=2, ensure_ascii=False)

        print(f"✔ Cleaned: {filename}")

    except Exception as e:
        print(f"✖ Skipped {filename}: {e}")
