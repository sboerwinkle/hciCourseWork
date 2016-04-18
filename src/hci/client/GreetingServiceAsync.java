package hci.client;

import com.google.gwt.user.client.rpc.AsyncCallback;

/**
 * The async counterpart of <code>GreetingService</code>.
 */
public interface GreetingServiceAsync {
  void postMessage(String msg, AsyncCallback<Void> callback);
  void getMessages(int lastPos, AsyncCallback<MsgPack> callback);
  void addBot(String bot, AsyncCallback<Integer> callbac);
}
