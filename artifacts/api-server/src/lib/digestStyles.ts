/**
 * Re-exports from the single source of truth in @workspace/digest-styles.
 *
 * Both this server PDF renderer and the client style-picker preview import
 * from that shared package, so any style change is reflected in both places
 * automatically.
 */
export {
  DIGEST_STYLE_IDS,
  DEFAULT_DIGEST_STYLE,
  DIGEST_STYLES,
  DIGEST_STYLES_LIST,
} from '@workspace/digest-styles';
export type { DigestStyleId, DigestStylePreset } from '@workspace/digest-styles';
