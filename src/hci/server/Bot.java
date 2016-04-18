package hci.server;

import java.util.ArrayList;

class Bot {

	ArrayList<Node> nodes = null;

	int addNode(String label, String rest) {
		Node addme;
		if (nodes == null) {
			if (!label.equals("End")) return -1;
			nodes = new ArrayList<Node>();
			addme = new EndNode();
		} else if (label.equals("Split")) addme = new SplitNode();
		else if (label.equals("Unsplit")) addme = new UnsplitNode();
		else if (label.equals("Then")) addme = new ThenNode();
		else if (label.equals("Matches")) addme = new MatchesNode();
		else if (label.equals("Random")) addme = new RandomNode();
		else if (label.equals("Select")) addme = new SelectNode();
		else if (label.equals("Start")) addme = new StartNode();
		else addme = new ConstantNode(label);
		nodes.add(addme);
		return addme.parseInputs(rest);
	}
	int compile() {
		if (nodes == null) return 1;
		if (nodes.get(0).compile(nodes)) return 2;
		return 0;
	}
	public String toString() {
		StringBuilder ret = new StringBuilder();
		for (Node n : nodes) ret.append(n);
		return ret.toString();
	}
	abstract class Node {
		boolean loopChecker = false;
		boolean compiled = false;
		Node[] inputs;
		int[] inputIndices;

		Node(int numInputs) {
			inputIndices = new int[numInputs];
		}

		boolean compile(ArrayList<Node> nodes) {
			//If I already compiled, everything's fine.
			if (compiled) return false;
			//If I haven't compiled, but am in the process further up the call stack, that's bad.
			if (loopChecker) return true;
			loopChecker = true;
			inputs = new Node[inputIndices.length];
			for (int i = 0; i < inputs.length; i++) {
				int ix = inputIndices[i];
				if (ix < 0 || ix >= nodes.size()) return true;
				inputs[i] = nodes.get(inputIndices[i]);
				//propagate any errors up the call stack
				if (inputs[i].compile(nodes)) return true;
			}
			compiled = true;
			//No errors
			return false;
		}

		int parseInputs(String rest) {
			int ix = 1;
			for (int i = 0; i < inputIndices.length; i++) {
				int nextIx = rest.indexOf(',', ix);
				if (nextIx == -1) return -1;
				try {
					inputIndices[i] = Integer.parseInt(rest.substring(ix, nextIx));
				} catch (NumberFormatException e) {
					return -1;
				}
				//read it in
				ix = nextIx + 1;
			}
			return ix+1;
		}

		String argsToString() {
			StringBuilder ret = new StringBuilder("(");
			for (int i : inputIndices) {
				ret.append(i);
				ret.append(',');
			}
			ret.append(")");
			return ret.toString();
		}
	}
	class StartNode extends Node {
		StartNode() {
			super(0);
		}
		public String toString() {return "Start"+argsToString();}
	}
	class EndNode extends Node {
		EndNode() {
			super(1);
		}
		public String toString() {return "End"+argsToString();}
	}
	class SplitNode extends Node {
		SplitNode() {
			super(2);
		}
		public String toString() {return "Split"+argsToString();}
	}
	class UnsplitNode extends Node {
		UnsplitNode() {
			super(2);
		}
		public String toString() {return "unSplit"+argsToString();}
	}
	class ThenNode extends Node {
		ThenNode() {
			super(2);
		}
		public String toString() {return "Then"+argsToString();}
	}
	class MatchesNode extends Node {
		MatchesNode() {
			super(2);
		}
		public String toString() {return "Matches"+argsToString();}
	}
	class RandomNode extends Node {
		RandomNode() {
			super(0);
		}
		public String toString() {return "Random"+argsToString();}
	}
	class SelectNode extends Node {
		SelectNode() {
			super(3);
		}
		public String toString() {return "Select"+argsToString();}
	}
	class ConstantNode extends Node {
		String text;
		ConstantNode(String t) {
			super(0);
			if (t.length() >= 2) {
				text = t.substring(1, t.length()-1);
			} else {
				text = t;
			}
		}
		public String toString() {return "\""+text+"\""+argsToString();}
	}
}
