package hci.server;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Random;
import java.util.regex.PatternSyntaxException;

class Bot {

	private Random rand = new Random();
	private ArrayList<Node> nodes = null;
	private String input;

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
	String evaluate(String in) {
		input = in;
		return nodes.get(0).getChunk()[0];
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

		//The result of getChunk() should only change if one of the inputs.getChunk() changes.
		//The exception is Random and Start, which may change despite not having inputs.
		abstract String[] getChunk();
	}
	//Wraps a Node to allow for getting a single string at a time.
	//I don't want this in the node class itself, because this way
	//it's harder to code the "wrong" behavior of not resetting
	//inputNode's stream between calls to requestingNode.getChunk()
	class Stream {
		String[] lastChunk;
		int index;
		Node pullFrom;
		Stream(Node n) {
			pullFrom = n;
			lastChunk = pullFrom.getChunk();
			index = 0;
		}
		String next() {
			while (index >= lastChunk.length) {
				lastChunk = pullFrom.getChunk();
				index = 0;
			}
			return lastChunk[index++];
		}
	}
	class StartNode extends Node {
		StartNode() {
			super(0);
		}
		public String toString() {return "Start"+argsToString();}
		String[] getChunk() {return new String[] {input};}
	}
	class EndNode extends Node {
		EndNode() {
			super(1);
		}
		public String toString() {return "End"+argsToString();}
		String[] getChunk() {return inputs[0].getChunk();}
	}
	class SplitNode extends Node {
		SplitNode() {
			super(2);
		}
		public String toString() {return "Split"+argsToString();}
		String[] getChunk() {
			Stream patterns = new Stream(inputs[1]);
			LinkedList<String> ret = new LinkedList<String>();
			for (String s : inputs[0].getChunk()) {
				String[] spl = new String[] {null, s};
				do {
					try {
						spl = spl[1].split(patterns.next(), 2);
					} catch(PatternSyntaxException e){
						spl = spl[1].split("", 2);
					}
					ret.add(spl[0]);
				} while (spl.length == 2);
			}
			return ret.toArray(new String[0]);
		}
	}
	class UnsplitNode extends Node {
		UnsplitNode() {
			super(2);
		}
		public String toString() {return "Unsplit"+argsToString();}
		String[] getChunk() {
			Stream glue = new Stream(inputs[1]);
			String[] bits = inputs[0].getChunk();
			StringBuilder sb = new StringBuilder(bits[0]);
			for (int i = 1; i < bits.length; i++) {
				sb.append(glue.next());
				sb.append(bits[i]);
			}
			return new String[] {sb.toString()};
		}
	}
	class ThenNode extends Node {
		ThenNode() {
			super(2);
		}
		public String toString() {return "Then"+argsToString();}
		String[] getChunk() {
			String[] arr1 = inputs[0].getChunk();
			String[] arr2 = inputs[1].getChunk();
			String[] ret = new String[arr1.length + arr2.length];
			System.arraycopy(arr1, 0, ret, 0, arr1.length);
			System.arraycopy(arr2, 0, ret, arr1.length, arr2.length);
			return ret;
		}
	}
	class MatchesNode extends Node {
		MatchesNode() {
			super(2);
		}
		public String toString() {return "Matches"+argsToString();}
		String[] getChunk() {
			Stream patterns = new Stream(inputs[1]);
			String[] in = inputs[0].getChunk();
			String[] ret = new String[in.length];
			for (int i = 0; i < in.length; i++) {
				try {
					ret[i] = in[i].matches(patterns.next()) ? "T" : "F";
				} catch (PatternSyntaxException e) {
					ret[i] = "F";
				}
			}
			return ret;
		}
	}
	class RandomNode extends Node {
		RandomNode() {
			super(0);
		}
		public String toString() {return "Random"+argsToString();}
		String[] getChunk() {
			return new String[] {rand.nextBoolean() ? "T" : "F"};
		}
	}
	class SelectNode extends Node {
		SelectNode() {
			super(3);
		}
		public String toString() {return "Select"+argsToString();}
		String[] getChunk() {
			Stream choices = new Stream(inputs[2]);
			Stream alternatives = new Stream(inputs[1]);
			String[] main = inputs[0].getChunk();
			String[] ret = new String[main.length];
			for (int i = 0; i < main.length; i++) {
				String alt = alternatives.next();
				ret[i] = choices.next().equals("T") ? main[i] : alt;
			}
			return ret;
		}
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
		String[] getChunk() {
			return new String[] {text};
		}
	}
}
