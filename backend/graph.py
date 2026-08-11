from langgraph.graph import StateGraph, END

from schemas import TrialMatchState

from nodes.extract_query import extract_query_node
from nodes.semantic_match import semantic_match_node
from nodes.fetch_trials import fetch_trials_node
from nodes.filter_rank import filter_rank_node
from nodes.explain_eligibility import explain_eligibility_node


graph = StateGraph(TrialMatchState)


graph.add_node(
    "extract_query",
    extract_query_node
)

graph.add_node(
    "semantic_match",
    semantic_match_node
)

graph.add_node(
    "fetch_trials",
    fetch_trials_node
)

graph.add_node(
    "filter_rank",
    filter_rank_node
)

graph.add_node(
    "explain_eligibility",
    explain_eligibility_node
)


graph.set_entry_point(
    "extract_query"
)


graph.add_edge(
    "extract_query",
    "semantic_match"
)

graph.add_edge(
    "semantic_match",
    "fetch_trials"
)

graph.add_edge(
    "fetch_trials",
    "filter_rank"
)

graph.add_edge(
    "filter_rank",
    "explain_eligibility"
)

graph.add_edge(
    "explain_eligibility",
    END
)


app_graph = graph.compile()
