package hci.client;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.GWT;
import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.event.dom.client.KeyCodes;
import com.google.gwt.event.dom.client.KeyUpEvent;
import com.google.gwt.event.dom.client.KeyUpHandler;
import com.google.gwt.user.client.rpc.AsyncCallback;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.DialogBox;
import com.google.gwt.user.client.ui.HTML;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.RootPanel;
import com.google.gwt.user.client.ui.TextBox;
import com.google.gwt.user.client.ui.VerticalPanel;
import com.google.gwt.core.client.Scheduler;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class ChatRoom implements EntryPoint {
	/**
	 * The message displayed to the user when the server cannot be reached or
	 * returns an error.
	 */
	private static final String SERVER_ERROR = "An error occurred while "
			+ "attempting to contact the server. Please check your network "
			+ "connection and try again.";

	/**
	 * Create a remote service proxy to talk to the server-side Greeting service.
	 */
	private final GreetingServiceAsync greetingService = GWT.create(GreetingService.class);

	VerticalPanel dialogVPanel;
	int numMessages = 0;
	int lastMessage = 0;

	void updateMessages() {
		synchronized (dialogVPanel) {
			greetingService.getMessages(lastMessage, new AsyncCallback<MsgPack>() {
				public void onFailure(Throwable caught) {
					//Nothing. Not a bit.
				}
				public void onSuccess(MsgPack reply) {
					synchronized(dialogVPanel) {
						int numToSkip;
						if (reply.index <= lastMessage) {
							numToSkip = lastMessage-reply.index;
						} else {
							numToSkip = MsgPack.QUEUE_LEN - (reply.index-lastMessage);
						}
						while (numToSkip < reply.msgs.length) {
							dialogVPanel.add(new Label(reply.msgs[numToSkip]));
							numMessages++;
							numToSkip++;
							lastMessage++;
						}
						while (numMessages > 30) {
							numMessages--;
							dialogVPanel.remove(0);
						}
						lastMessage %= MsgPack.QUEUE_LEN;
					}
				}
			});
		}
	}

	/**
	 * This is the entry point method.
	 */
	public void onModuleLoad() {
		final TextBox msgField = new TextBox();
		msgField.setText("Enter Message...");

		RootPanel.get("textEntryDiv").add(msgField);
		// Focus the cursor on the name field when the app loads
		msgField.setFocus(true);
		msgField.selectAll();

		dialogVPanel = new VerticalPanel();
		RootPanel.get("dialogDiv").add(dialogVPanel);
		dialogVPanel.addStyleName("dialogVPanel");

		Scheduler.get().scheduleFixedDelay(new Scheduler.RepeatingCommand() {
			public boolean execute() {
				updateMessages();
				return true;
			}
		}, 1000);

		// Create a handler for the sendButton and msgField
		class MyHandler implements KeyUpHandler {
			/**
			 * Fired when the user types in the msgField.
			 */
			public void onKeyUp(KeyUpEvent event) {
				if (event.getNativeKeyCode() == KeyCodes.KEY_ENTER) {
					sendNameToServer();
				}
			}

			/**
			 * Send the name from the msgField to the server and wait for a response.
			 */
			private void sendNameToServer() {
				String textToServer = msgField.getText();
				msgField.setText("");
				greetingService.postMessage(textToServer, new AsyncCallback<Void>() {
					public void onFailure(Throwable caught) {
						msgField.setText(caught.getMessage());
					}

					public void onSuccess(Void v) {
						updateMessages();
					}
				});
			}
		}

		// Add a handler to send the name to the server
		MyHandler handler = new MyHandler();
		msgField.addKeyUpHandler(handler);
	}
}
