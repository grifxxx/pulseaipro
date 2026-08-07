-- Byte size of the cover image file, needed for the Zen RSS feed's <enclosure length="..."/>
-- attribute (Dzen requires it). Null for articles published before this was tracked — those
-- just don't get an <enclosure> tag, same as before.

alter table articles add column if not exists cover_image_bytes integer;
