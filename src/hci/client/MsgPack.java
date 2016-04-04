package hci.client;

import java.io.Serializable;

public class MsgPack implements Serializable {
	public static final int QUEUE_LEN = 20;
	public int index;
	public String[] msgs;
	public MsgPack(int ix, String[] ms) {
		index = ix;
		msgs = ms;
	}
	public MsgPack() {
		index = 0;
	}
}
