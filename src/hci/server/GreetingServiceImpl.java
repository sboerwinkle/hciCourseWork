package hci.server;

import hci.client.GreetingService;
import hci.client.MsgPack;
import com.google.gwt.user.server.rpc.RemoteServiceServlet;

/**
 * The server-side implementation of the RPC service.
 */
@SuppressWarnings("serial")
public class GreetingServiceImpl extends RemoteServiceServlet implements
	GreetingService {

	String[] msgs = new String[MsgPack.QUEUE_LEN];
	int lastMessage = 0;

	public void postMessage(String msg) {
		synchronized(this) {
			//msg = escapeHtml(msg); // Shouldn't be necessary since the clients display the results in GWT labels
			msgs[lastMessage++] = msg;
			if (lastMessage == MsgPack.QUEUE_LEN) lastMessage = 0;
		}
	}

	public MsgPack getMessages(int hisLastMessage) {
		int len = (lastMessage-hisLastMessage+MsgPack.QUEUE_LEN)%MsgPack.QUEUE_LEN;
		String[] ret = new String[len];
		if (len + hisLastMessage > MsgPack.QUEUE_LEN) {
			int l1 = MsgPack.QUEUE_LEN-hisLastMessage;
			int l2 = len - l1;
			System.arraycopy(msgs, hisLastMessage, ret, 0, l1);
			System.arraycopy(msgs, 0, ret, l1, l2);
		} else {
			System.arraycopy(msgs, hisLastMessage, ret, 0, len);
		}
		return new MsgPack(hisLastMessage, ret);
	}

	public Integer addBot(String formula) {
		char[] data = formula.toCharArray();
		Bot b = new Bot();
		for (int i = 0; i < data.length;) {
			//First, pull the node's label.
			StringBuilder sb = new StringBuilder();
			for (; i < data.length && data[i] != '('; i++) {
				if (data[i] == '\\') {
					if (i < data.length-1) {
						sb.append(data[++i]);
					} else {
						return 1;
					}
				} else {
					sb.append(data[i]);
				}
			}
			if (i >= data.length) return 1;
			int j = b.addNode(sb.toString(), formula.substring(i));
			if (j == -1) return 1;
			i += j;
		}
		int res = b.compile();
		if (res != 0) return res;
		//Add the bot to the list
		System.out.println(b);
		return 0;
	}

	/**
	 * Escape an html string. Escaping data received from the client helps to
	 * prevent cross-site script vulnerabilities.
	 * 
	 * @param html the html string to escape
	 * @return the escaped string
	 */
	private String escapeHtml(String html) {
		if (html == null) {
			return null;
		}
		return html.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
				">", "&gt;");
	}
}
