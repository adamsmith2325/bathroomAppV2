import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  buttonRow: {
    marginTop: 12,
  },
  commentList: {
    paddingVertical: 8,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  closeBtn: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#444',
  },
  /* commenter’s name */
  commentName: {
    fontWeight: '600',       // or use your theme’s bold
    marginBottom: 2,
  },

  /* the comment text itself */
  commentText: {
    fontSize: 14,
    marginBottom: 4,
  },

  /* small timestamp under the comment */
  commentTimestamp: {
    fontSize: 12,
    color: '#666',           // or your theme’s muted color
  },

  /* when there are no comments */
  commentEmpty: {
    fontStyle: 'italic',
    color: '#999',           // or your theme’s secondary
    marginVertical: 16,
    textAlign: 'center',
  },
});
